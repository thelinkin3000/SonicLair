import { useState, useEffect } from 'react'

export default function UseVisible(element: any, rootMargin: string) {
    const [isVisible, setState] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setState(entry.isIntersecting);
                    if(element.current){
                        observer.unobserve(element.current);
                    }
                }
            }, { rootMargin }
        );

        element.current && observer.observe(element.current);

        return () => {
            if(element.current){
                observer.unobserve(element.current)

            }
        };
    }, []);

    return isVisible;
};